(*---
description: Two names sharing a bound cannot be equal.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [tuples]
outcome: parse-error
---*)
---- MODULE bounds_reuse_name_shared_set ----
Test == \A x, x \in {1} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 15 to line 8, col 15 of module bounds_reuse_name_shared_set
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 12 to line 8, col 12 of module bounds_reuse_name_shared_set.
    3002:1 Parsing or semantic analysis failed.
---*)
