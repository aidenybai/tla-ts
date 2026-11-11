(*---
description: "Prime is a built-in, so defining it is rejected."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_postfix_prime_definition ----
a ' == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 8 of module builtin_postfix_prime_definition
    | Operator ' already defined or declared.
    | line 8, col 1 to line 8, col 8 of module builtin_postfix_prime_definition
    | Symbol ' is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
