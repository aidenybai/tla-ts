(*---
description: Evaluates a random set expression, seed 262, number 3208.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03208 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) .. (IF TRUE THEN 1 ELSE 7 - (CHOOSE b5095 \in {} : TRUE))) \cup ({(7 * -1), (CHOOSE b5096 \in {} : TRUE)} \ (Cardinality(2..1) .. LET b5097 == 7 IN b5097))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 135 to line 14, col 135 of module random_03208 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 133.
    | Expression starting at line 14, column 133.
    | ExtendableExpr starting at line 14, column 132.
    | Expression starting at line 14, column 132.
    | Some { } form starting at line 14, column 131.
    | Fatal errors while parsing TLA+ spec in file random_03208
    | In module random_03208
    | Could not parse module random_03208 from file random_03208.tla
    | *** Errors: 1
    | In module random_03208
    | Could not parse module random_03208 from file random_03208.tla
    3002:1 Parsing or semantic analysis failed.
---*)
