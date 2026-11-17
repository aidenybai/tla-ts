(*---
description: A built-in operator symbol has no subexpression.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE selector_of_operator_symbol ----
Test == '!x /\ \cup!1 /\ \X!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 8, col 9 to line 8, col 9 of module selector_of_operator_symbol
    | Cannot take subexpression of `''.
    | line 8, col 16 to line 8, col 19 of module selector_of_operator_symbol
    | Cannot take subexpression of `\union'.
    | line 8, col 26 to line 8, col 27 of module selector_of_operator_symbol
    | Cannot take subexpression of `\times'.
    3002:1 Parsing or semantic analysis failed.
---*)
