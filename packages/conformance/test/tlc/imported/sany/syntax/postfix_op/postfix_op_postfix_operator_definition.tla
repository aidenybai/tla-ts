(*---
description: Postfix Operator Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/postfix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE postfix_op_postfix_operator_definition ----

x^+ == 1
x^* == 2
x^# == 3
x' == 4

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 13, col 1 to line 13, col 7 of module postfix_op_postfix_operator_definition
    | Operator ' already defined or declared.
    | line 13, col 1 to line 13, col 7 of module postfix_op_postfix_operator_definition
    | Symbol ' is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
