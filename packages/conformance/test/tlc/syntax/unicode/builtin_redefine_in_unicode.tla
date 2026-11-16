(*---
description: Defining a built-in through its Unicode spelling is the same redefinition error.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [unicode]
outcome: parse-error
---*)
---- MODULE builtin_redefine_in_unicode ----
a ∧ b == a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 10 of module builtin_redefine_in_unicode
    | Operator \land already defined or declared.
    | line 8, col 1 to line 8, col 10 of module builtin_redefine_in_unicode
    | Symbol \land is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
