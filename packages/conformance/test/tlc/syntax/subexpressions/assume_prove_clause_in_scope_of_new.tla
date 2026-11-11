(*---
description: A clause after a NEW cannot be selected from outside its scope.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE assume_prove_clause_in_scope_of_new ----
THEOREM T == ASSUME NEW x, x = 1 PROVE x = 1
Test == T!2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 11 of module assume_prove_clause_in_scope_of_new
    | Accessing ASSUME/PROVE clause within the scope of a declaration
    |  from outside that declaration's scope.
    3002:1 Parsing or semantic analysis failed.
---*)
