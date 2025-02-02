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

import { Node, Relationship } from "../../classes";
import { ConnectionWhereArg, Context } from "../../types";
import createRelationshipWhereAndParams from "./create-relationship-where-and-params";
import createNodeWhereAndParams from "./create-node-where-and-params";

function createConnectionWhereAndParams({
    whereInput,
    context,
    node,
    nodeVariable,
    relationship,
    relationshipVariable,
    parameterPrefix,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    nodeVariable: string;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
}): [string, any] {
    const reduced = Object.entries(whereInput).reduce<{ whereStrs: string[]; params: any }>(
        (res, [k, v]) => {
            if (["AND", "OR"].includes(k)) {
                const innerClauses: string[] = [];
                const innerParams: any[] = [];

                v.forEach((o, i) => {
                    const or = createConnectionWhereAndParams({
                        whereInput: o,
                        node,
                        nodeVariable,
                        relationship,
                        relationshipVariable,
                        context,
                        parameterPrefix: `${parameterPrefix}.${k}[${i}]`,
                    });

                    innerClauses.push(`${or[0]}`);
                    innerParams.push(or[1]);
                });

                const whereStrs = [...res.whereStrs, `(${innerClauses.filter((clause) => !!clause).join(` ${k} `)})`];
                const params = { ...res.params, [k]: innerParams };
                res = { whereStrs, params };
                return res;
            }

            if (k.startsWith("edge")) {
                const relationshipWhere = createRelationshipWhereAndParams({
                    whereInput: v,
                    relationship,
                    relationshipVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${k}`,
                });

                const whereStrs = [
                    ...res.whereStrs,
                    k === "edge_NOT" ? `(NOT ${relationshipWhere[0]})` : relationshipWhere[0],
                ];
                const params = { ...res.params, [k]: relationshipWhere[1] };
                res = { whereStrs, params };
                return res;
            }

            if (k.startsWith("node") || k.startsWith(node.name)) {
                const nodeWhere = createNodeWhereAndParams({
                    whereInput: v,
                    node,
                    nodeVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${k}`,
                });

                const whereStrs = [...res.whereStrs, k.endsWith("_NOT") ? `(NOT ${nodeWhere[0]})` : nodeWhere[0]];
                const params = { ...res.params, [k]: nodeWhere[1] };
                res = { whereStrs, params };
            }
            return res;
        },
        { whereStrs: [], params: {} }
    );

    return [reduced.whereStrs.join(" AND "), reduced.params];
}

export default createConnectionWhereAndParams;
