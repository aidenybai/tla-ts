(*---
description: Postfix Operator Application. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/postfix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE postfix_op_postfix_operator_application ----
op == {
  x^+,
  x^*,
  x^#,
  x'
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 7
    | line 10, col 4 to line 10, col 5 of module postfix_op_postfix_operator_application
    | Could not find declaration or definition of symbol '^+'.
    | line 10, col 3 to line 10, col 5 of module postfix_op_postfix_operator_application
    | Couldn't resolve postfix operator symbol `^+'.
    | line 11, col 4 to line 11, col 5 of module postfix_op_postfix_operator_application
    | Could not find declaration or definition of symbol '^*'.
    | line 11, col 3 to line 11, col 5 of module postfix_op_postfix_operator_application
    | Couldn't resolve postfix operator symbol `^*'.
    | line 12, col 4 to line 12, col 5 of module postfix_op_postfix_operator_application
    | Could not find declaration or definition of symbol '^#'.
    | line 12, col 3 to line 12, col 5 of module postfix_op_postfix_operator_application
    | Couldn't resolve postfix operator symbol `^#'.
    | line 13, col 3 to line 13, col 3 of module postfix_op_postfix_operator_application
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
