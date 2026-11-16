(*---
description: "UNCHANGED is a built-in prefix operator, so defining it is an error."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [operators]
outcome: parse-error
---*)
---- MODULE prefix_redefine_unchanged ----
UNCHANGED a == a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 16 of module prefix_redefine_unchanged
    | Operator UNCHANGED already defined or declared.
    | line 8, col 1 to line 8, col 16 of module prefix_redefine_unchanged
    | Symbol UNCHANGED is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
