(*---
description: Nonfix Prefix Operators. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/prefix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE prefix_op_nonfix_prefix_operators ----
op == {
  A!B!~(x),
  A!B!\lnot(x),
  A!B!\neg(x),
  A!B!UNION(x),
  A!B!SUBSET(x),
  A!B!DOMAIN(x),
  A!B!-.(x),
  A!B!ENABLED(x),
  A!B!UNCHANGED(x),
  A!B![](x),
  A!B!<>(x)
}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 11
    | line 10, col 3 to line 10, col 7 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!\lnot'.
    | line 11, col 3 to line 11, col 11 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!\lnot'.
    | line 12, col 3 to line 12, col 10 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!\lnot'.
    | line 13, col 3 to line 13, col 11 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!UNION'.
    | line 14, col 3 to line 14, col 12 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!SUBSET'.
    | line 15, col 3 to line 15, col 12 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!DOMAIN'.
    | line 16, col 3 to line 16, col 8 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!-.'.
    | line 17, col 3 to line 17, col 13 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!ENABLED'.
    | line 18, col 3 to line 18, col 15 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!UNCHANGED'.
    | line 19, col 3 to line 19, col 8 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B![]'.
    | line 20, col 3 to line 20, col 8 of module prefix_op_nonfix_prefix_operators
    | Unknown operator: `A!B!<>'.
    3002:1 Parsing or semantic analysis failed.
---*)
