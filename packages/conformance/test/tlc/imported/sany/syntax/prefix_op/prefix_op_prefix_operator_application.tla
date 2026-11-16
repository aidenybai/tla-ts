(*---
description: Prefix Operator Application. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/prefix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE prefix_op_prefix_operator_application ----
op == {
  ~x,
  \lnot x,
  \neg x,
  UNION x,
  SUBSET x,
  DOMAIN x,
  -x,
  ENABLED x,
  UNCHANGED x,
  []x,
  <>x
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 12
    | line 10, col 4 to line 10, col 4 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 11, col 9 to line 11, col 9 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 12, col 8 to line 12, col 8 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 13, col 9 to line 13, col 9 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 14, col 10 to line 14, col 10 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 15, col 10 to line 15, col 10 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 16, col 3 to line 16, col 3 of module prefix_op_prefix_operator_application
    | Could not find declaration or definition of symbol '-.'.
    | line 16, col 3 to line 16, col 4 of module prefix_op_prefix_operator_application
    | Couldn't resolve prefix operator symbol `-.'.
    | line 17, col 11 to line 17, col 11 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 18, col 13 to line 18, col 13 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 19, col 5 to line 19, col 5 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    | line 20, col 5 to line 20, col 5 of module prefix_op_prefix_operator_application
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
