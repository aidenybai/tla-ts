(*---
description: Prefix Operator Declaration as Parameter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/prefix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE prefix_op_prefix_operator_declaration_as_parameter ----

op(
  ~ _,
  \lnot _,
  \neg _,
  UNION _,
  SUBSET _,
  DOMAIN _,
  -. _,
  ENABLED _,
  UNCHANGED _,
  [] _,
  <> _
) == 11

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 9
    | line 12, col 3 to line 12, col 9 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol \lnot is a built-in operator, and cannot be redefined.
    | line 13, col 3 to line 13, col 8 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol \neg is a built-in operator, and cannot be redefined.
    | line 14, col 3 to line 14, col 9 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol UNION is a built-in operator, and cannot be redefined.
    | line 15, col 3 to line 15, col 10 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol SUBSET is a built-in operator, and cannot be redefined.
    | line 16, col 3 to line 16, col 10 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol DOMAIN is a built-in operator, and cannot be redefined.
    | line 18, col 3 to line 18, col 11 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol ENABLED is a built-in operator, and cannot be redefined.
    | line 19, col 3 to line 19, col 13 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol UNCHANGED is a built-in operator, and cannot be redefined.
    | line 20, col 3 to line 20, col 6 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol [] is a built-in operator, and cannot be redefined.
    | line 21, col 3 to line 21, col 6 of module prefix_op_prefix_operator_declaration_as_parameter
    | Symbol <> is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
