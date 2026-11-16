(*---
description: Evaluates a random function expression, seed 262, number 1758.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01758 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((Cardinality({2, 1, 3}) * [[a |-> 1] EXCEPT !.a = 2147483647]) + LET b2795 == (7 \div -1) IN Len(<<>>)), IF ((3 < 1) <=> (TRUE <=> TRUE)) THEN Len(Tail(<<1, 2>>)) ELSE Head(Append(<<>>, -1))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 99 to line 14, col 102 of module random_01758 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | ExtendableExpr starting at line 14, column 96.
    | Expression starting at line 14, column 96.
    | Definition starting at line 14, column 87.
    | Fatal errors while parsing TLA+ spec in file random_01758
    | In module random_01758
    | Could not parse module random_01758 from file random_01758.tla
    | *** Errors: 1
    | In module random_01758
    | Could not parse module random_01758 from file random_01758.tla
    3002:1 Parsing or semantic analysis failed.
---*)
