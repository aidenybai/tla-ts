(*---
description: Cartesian Product Infix Op Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/infix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE infix_op_cartesian_product_infix_op_definition ----
x \X y == 0
x \times y == 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 9, col 1 to line 9, col 11 of module infix_op_cartesian_product_infix_op_definition
    | Operator \times already defined or declared.
    | line 9, col 1 to line 9, col 11 of module infix_op_cartesian_product_infix_op_definition
    | Symbol \times is a built-in operator, and cannot be redefined.
    | line 10, col 1 to line 10, col 15 of module infix_op_cartesian_product_infix_op_definition
    | Operator \times already defined or declared.
    | line 10, col 1 to line 10, col 15 of module infix_op_cartesian_product_infix_op_definition
    | Symbol \times is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
