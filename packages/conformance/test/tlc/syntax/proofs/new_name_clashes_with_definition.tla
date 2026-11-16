(*---
description: A NEW name cannot reuse a symbol.
ref: "tla2sany/semantic/Generator.java#generateNewSymb"
features: [proofs]
outcome: parse-error
---*)
---- MODULE new_name_clashes_with_definition ----
A == 1
THEOREM ASSUME NEW A PROVE TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 20 to line 9, col 20 of module new_name_clashes_with_definition
    | Multiply-defined symbol 'A': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module new_name_clashes_with_definition.
    3002:1 Parsing or semantic analysis failed.
---*)
