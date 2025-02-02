/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import camelCase from "camelcase";
import {
    printSchema,
    parse,
    ObjectTypeDefinitionNode,
    NamedTypeNode,
    ListTypeNode,
    NonNullTypeNode,
    InputObjectTypeDefinitionNode,
} from "graphql";
import { pluralize } from "graphql-compose";
import makeAugmentedSchema from "./make-augmented-schema";
import { Node } from "../classes";
import * as constants from "../constants";

describe("makeAugmentedSchema", () => {
    test("should be a function", () => {
        expect(makeAugmentedSchema).toBeInstanceOf(Function);
    });

    test("should return the correct schema", () => {
        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });
        const document = parse(printSchema(neoSchema.schema));
        const queryObject = document.definitions.find(
            (x) => x.kind === "ObjectTypeDefinition" && x.name.value === "Query"
        ) as ObjectTypeDefinitionNode;

        ["Actor", "Movie"].forEach((type) => {
            const node = neoSchema.nodes.find((x) => x.name === type);
            expect(node).toBeInstanceOf(Node);
            const nodeObject = document.definitions.find(
                (x) => x.kind === "ObjectTypeDefinition" && x.name.value === type
            );
            expect(nodeObject).toBeTruthy();

            // Find
            const nodeFindQuery = queryObject.fields?.find((x) => x.name.value === pluralize(camelCase(type)));
            const nodeFindQueryType = (((nodeFindQuery?.type as NonNullTypeNode).type as ListTypeNode)
                .type as NonNullTypeNode).type as NamedTypeNode;
            expect(nodeFindQueryType.name.value).toEqual(type);

            // Options
            const options = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Options`
            );
            expect(options).toBeTruthy();

            // Where
            const where = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Where`
            );
            expect(where).toBeTruthy();

            // SORT
            const sort = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Sort`
            );
            expect(sort).toBeTruthy();
        });
    });

    test("should throw cannot have interface on relationship", () => {
        const typeDefs = `
                interface Node {
                    id: ID
                }

                type Movie {
                    title: String!
                    nodes: [Node] @relationship(type: "NODE", direction: IN)
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot have interface on relationship");
    });

    test("should throw cannot auto-generate a non ID field", () => {
        const typeDefs = `
            type Movie  {
                name: String! @id
            }
        `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot auto-generate a non ID field");
    });

    test("should throw cannot auto-generate an array", () => {
        const typeDefs = `
                type Movie  {
                    name: [ID] @id
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot auto-generate an array");
    });

    test("should throw cannot timestamp on array of DateTime", () => {
        const typeDefs = `
                type Movie  {
                    name: [DateTime] @timestamp(operations: [CREATE])
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot auto-generate an array");
    });

    test("should throw cannot have auth directive on a relationship", () => {
        const typeDefs = `
                type Movie {
                    movie: Movie @relationship(type: "NODE", direction: OUT) @auth(rules: [{operations: [CREATE]}])
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot have auth directive on a relationship");
    });

    describe("REGEX", () => {
        test("should remove the MATCHES filter by default", () => {
            const typeDefs = `
                    type Movie {
                        name: String
                    }
                `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const document = parse(printSchema(neoSchema.schema));

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === "MovieWhere"
            ) as InputObjectTypeDefinitionNode;

            const matchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("_MATCHES"));

            expect(matchesField).toBeUndefined();
        });

        test("should add the MATCHES filter when NEO4J_GRAPHQL_ENABLE_REGEX is set", () => {
            const typeDefs = `
                    type User {
                        name: String
                    }
                `;

            const neoSchema = makeAugmentedSchema({ typeDefs }, { enableRegex: true });

            const document = parse(printSchema(neoSchema.schema));

            const nodeWhereInput = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === "UserWhere"
            ) as InputObjectTypeDefinitionNode;

            const matchesField = nodeWhereInput.fields?.find((x) => x.name.value.endsWith("_MATCHES"));

            expect(matchesField).not.toBeUndefined();
        });
    });

    describe("issues", () => {
        test("158", () => {
            // https://github.com/neo4j/graphql/issues/158

            const typeDefs = `
                type Movie {
                    createdAt: DateTime
                }

                type Query {
                  movies: [Movie] @cypher(statement: "")
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const document = parse(printSchema(neoSchema.schema));

            // make sure the schema constructs
            expect(document.kind).toEqual("Document");
        });
    });

    test("should throw error if @auth is used on relationship properties interface", () => {
        const typeDefs = `
            type Movie {
                actors: Actor @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn @auth(rules: [{ operations: [CREATE], roles: ["admin"] }]) {
                screenTime: Int
            }
        `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
            "Cannot have @auth directive on relationship properties interface"
        );
    });

    test("should throw error if @cypher is used on relationship properties interface", () => {
        const typeDefs = `
            type Movie {
                actors: Actor @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn @cypher(statement: "RETURN rand()") {
                screenTime: Int
            }
        `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow('Directive "@cypher" may not be used on INTERFACE.');
    });

    test("should throw error if @auth is used on relationship property", () => {
        const typeDefs = `
            type Movie {
                actors: Actor @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn {
                screenTime: Int @auth(rules: [{ operations: [CREATE], roles: ["admin"] }])
            }
        `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("Cannot have @auth directive on relationship property");
    });

    test("should throw error if @relationship is used on relationship property", () => {
        const typeDefs = `
            type Movie {
                actors: Actor @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn {
                actors: Actor @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
            "Cannot have @relationship directive on relationship property"
        );
    });

    test("should throw error if @cypher is used on relationship property", () => {
        const typeDefs = `
            type Movie {
                actors: Actor @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Actor {
                name: String
            }

            interface ActedIn {
                id: ID @cypher(statement: "RETURN id(this)")
                roles: [String]
            }
        `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
            "Cannot have @cypher directive on relationship property"
        );
    });

    describe("Reserved Names", () => {
        describe("Node", () => {
            test("should throw when using PageInfo as node name", () => {
                const typeDefs = `
                    type PageInfo {
                        id: ID
                    }
                `;

                expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
                    (constants.RESERVED_TYPE_NAMES.find((x) => x[0] === "PageInfo") as string[])[1]
                );
            });

            test("should throw when using Connection in a node name", () => {
                const typeDefs = `
                    type NodeConnection {
                        id: ID
                    }
                `;

                expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
                    (constants.RESERVED_TYPE_NAMES.find((x) => x[0] === "Connection") as string[])[1]
                );
            });

            test("should throw when using Node as node name", () => {
                const typeDefs = `
                    type Node {
                        id: ID
                    }
                `;

                expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
                    (constants.RESERVED_TYPE_NAMES.find((x) => x[0] === "Node") as string[])[1]
                );
            });
        });

        describe("Interface", () => {
            test("should throw when using PageInfo as relationship properties interface name", () => {
                const typeDefs = `
                    type Movie {
                        id: ID
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: OUT, properties: "PageInfo")
                    }

                    interface PageInfo {
                        screenTime: Int
                    }

                    type Actor {
                        name: String
                    }
                `;

                expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
                    (constants.RESERVED_TYPE_NAMES.find((x) => x[0] === "PageInfo") as string[])[1]
                );
            });

            test("should throw when using Connection in a properties interface name", () => {
                const typeDefs = `
                    type Movie {
                        id: ID
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: OUT, properties: "NodeConnection")
                    }

                    interface NodeConnection {
                        screenTime: Int
                    }

                    type Actor {
                        name: String
                    }
                `;

                expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
                    (constants.RESERVED_TYPE_NAMES.find((x) => x[0] === "Connection") as string[])[1]
                );
            });

            test("should throw when using Node as relationship properties interface name", () => {
                const typeDefs = `
                    type Movie {
                        id: ID
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: OUT, properties: "Node")
                    }

                    interface Node {
                        screenTime: Int
                    }

                    type Actor {
                        name: String
                    }
                `;

                expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
                    (constants.RESERVED_TYPE_NAMES.find((x) => x[0] === "Node") as string[])[1]
                );
            });

            describe("Fields", () => {
                test("should throw when using 'node' as a relationship property", () => {
                    const typeDefs = `
                        type Movie {
                            id: ID
                            actors: [Actor] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                        }

                        interface ActedIn {
                            node: ID
                        }

                        type Actor {
                            name: String
                        }
                    `;

                    expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
                        (constants.RESERVED_INTERFACE_FIELDS.find((x) => x[0] === "node") as string[])[1]
                    );
                });

                test("should throw when using 'cursor' as a relationship property", () => {
                    const typeDefs = `
                        type Movie {
                            id: ID
                            actors: [Actor] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                        }

                        interface ActedIn {
                            cursor: ID
                        }

                        type Actor {
                            name: String
                        }
                    `;

                    expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
                        (constants.RESERVED_INTERFACE_FIELDS.find((x) => x[0] === "cursor") as string[])[1]
                    );
                });
            });
        });
    });
});
