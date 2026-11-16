(*---
description: Two bounds of one quantifier cannot reuse a name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [tuples]
outcome: parse-error
---*)
---- MODULE bounds_reuse_name_same_quantifier ----
Test == \A x \in {1}, x \in {2} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 23 to line 8, col 23 of module bounds_reuse_name_same_quantifier
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 12 to line 8, col 12 of module bounds_reuse_name_same_quantifier.
    3002:1 Parsing or semantic analysis failed.
---*)
