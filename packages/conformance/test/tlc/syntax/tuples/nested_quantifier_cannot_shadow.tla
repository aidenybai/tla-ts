(*---
description: A nested quantifier cannot shadow an outer bound name.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [tuples]
outcome: parse-error
---*)
---- MODULE nested_quantifier_cannot_shadow ----
Test == \A x \in {1} : \A x \in {2} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 27 to line 8, col 27 of module nested_quantifier_cannot_shadow
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 8, col 12 to line 8, col 12 of module nested_quantifier_cannot_shadow.
    3002:1 Parsing or semantic analysis failed.
---*)
