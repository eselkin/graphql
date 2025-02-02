# Cypher -> Connections -> Filtering -> Relationship -> String

Schema:

```graphql
type Movie {
    title: String!
    actors: [Actor!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
}

type Actor {
    name: String!
    movies: [Movie!]!
        @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
}

interface ActedIn {
    role: String!
    screenTime: Int!
}
```

```env
NEO4J_GRAPHQL_ENABLE_REGEX=1
```

---

## CONTAINS

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { role_CONTAINS: "Forrest" } }) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in_relationship.role CONTAINS $this_actorsConnection.args.where.edge.role_CONTAINS
    WITH collect({ role: this_acted_in_relationship.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "role_CONTAINS": "Forrest"
                }
            }
        }
    }
}
```

---

## NOT_CONTAINS

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { role_NOT_CONTAINS: "Forrest" } }) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE (NOT this_acted_in_relationship.role CONTAINS $this_actorsConnection.args.where.edge.role_NOT_CONTAINS)
    WITH collect({ role: this_acted_in_relationship.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "role_NOT_CONTAINS": "Forrest"
                }
            }
        }
    }
}
```

---

## STARTS_WITH

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { role_STARTS_WITH: "Forrest" } }) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in_relationship.role STARTS WITH $this_actorsConnection.args.where.edge.role_STARTS_WITH
    WITH collect({ role: this_acted_in_relationship.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "role_STARTS_WITH": "Forrest"
                }
            }
        }
    }
}
```

---

## NOT_STARTS_WITH

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { role_NOT_STARTS_WITH: "Forrest" } }) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE (NOT this_acted_in_relationship.role STARTS WITH $this_actorsConnection.args.where.edge.role_NOT_STARTS_WITH)
    WITH collect({ role: this_acted_in_relationship.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "role_NOT_STARTS_WITH": "Forrest"
                }
            }
        }
    }
}
```

---

## ENDS_WITH

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { role_ENDS_WITH: "Gump" } }) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in_relationship.role ENDS WITH $this_actorsConnection.args.where.edge.role_ENDS_WITH
    WITH collect({ role: this_acted_in_relationship.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "role_ENDS_WITH": "Gump"
                }
            }
        }
    }
}
```

---

## NOT_ENDS_WITH

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { role_NOT_ENDS_WITH: "Gump" } }) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE (NOT this_acted_in_relationship.role ENDS WITH $this_actorsConnection.args.where.edge.role_NOT_ENDS_WITH)
    WITH collect({ role: this_acted_in_relationship.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "role_NOT_ENDS_WITH": "Gump"
                }
            }
        }
    }
}
```

---

## MATCHES

### GraphQL Input

```graphql
query {
    movies {
        title
        actorsConnection(where: { edge: { role_MATCHES: "Forrest.+" } }) {
            edges {
                role
                node {
                    name
                }
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
CALL {
    WITH this
    MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Actor)
    WHERE this_acted_in_relationship.role =~ $this_actorsConnection.args.where.edge.role_MATCHES
    WITH collect({ role: this_acted_in_relationship.role, node: { name: this_actor.name } }) AS edges
    RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
}
RETURN this { .title, actorsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_actorsConnection": {
        "args": {
            "where": {
                "edge": {
                    "role_MATCHES": "Forrest.+"
                }
            }
        }
    }
}
```

---
