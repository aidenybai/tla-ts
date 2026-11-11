(*---
description: Cartesian Product as Parameter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/infix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE infix_op_cartesian_product_as_parameter ----
op == f(\X, \times)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | line 9, col 9 to line 9, col 10 of module infix_op_cartesian_product_as_parameter: \X may not be used as an infix operator.
    | Residual stack trace follows:
    | Optional Arguments starting at line 9, column 8.
    | Primitive expression starting at line 9, column 7.
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | Definition starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file infix_op_cartesian_product_as_parameter
    | In module infix_op_cartesian_product_as_parameter
    | Could not parse module infix_op_cartesian_product_as_parameter from file infix_op_cartesian_product_as_parameter.tla
    | *** Errors: 1
    | In module infix_op_cartesian_product_as_parameter
    | Could not parse module infix_op_cartesian_product_as_parameter from file infix_op_cartesian_product_as_parameter.tla
    3002:1 Parsing or semantic analysis failed.
---*)
