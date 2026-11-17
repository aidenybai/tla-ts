(*---
description: A built-in operator standing alone reports its arity under the name SANY resolves it to.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [operators]
outcome: parse-error
---*)
---- MODULE builtin_synonym_alone ----
Test == {\cup} = {} /\ \cap(1) = {} /\ {\X} = {} /\ #(1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 8, col 10 to line 8, col 13 of module builtin_synonym_alone
    | The operator \union requires 2 arguments.
    | line 8, col 28 to line 8, col 30 of module builtin_synonym_alone
    | The operator \intersect requires 2 arguments.
    | line 8, col 41 to line 8, col 42 of module builtin_synonym_alone
    | The operator \times requires 2 arguments.
    | line 8, col 54 to line 8, col 56 of module builtin_synonym_alone
    | The operator /= requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
