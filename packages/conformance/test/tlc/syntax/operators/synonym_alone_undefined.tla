(*---
description: An undefined operator standing alone is reported under the synonym SANY resolves it to.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [operators]
outcome: parse-error
---*)
---- MODULE synonym_alone_undefined ----
Test == {=<} = {} /\ \circ(1, 2) = 1 /\ (+)(1, 2) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 8, col 10 to line 8, col 11 of module synonym_alone_undefined
    | Unknown operator: `\leq'.
    | line 8, col 22 to line 8, col 26 of module synonym_alone_undefined
    | Unknown operator: `\o'.
    | line 8, col 41 to line 8, col 43 of module synonym_alone_undefined
    | Unknown operator: `\oplus'.
    3002:1 Parsing or semantic analysis failed.
---*)
