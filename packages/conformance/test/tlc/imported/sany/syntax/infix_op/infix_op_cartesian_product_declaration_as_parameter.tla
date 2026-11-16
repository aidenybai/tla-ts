(*---
description: Cartesian Product Declaration as Parameter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/infix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE infix_op_cartesian_product_declaration_as_parameter ----
op(_ \X _, _ \times _) == TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 4 to line 9, col 9 of module infix_op_cartesian_product_declaration_as_parameter
    | Symbol \times is a built-in operator, and cannot be redefined.
    | line 9, col 12 to line 9, col 21 of module infix_op_cartesian_product_declaration_as_parameter
    | Symbol \times is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
