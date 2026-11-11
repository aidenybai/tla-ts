(*---
description: Evaluates a random seq expression, seed 262, number 4281.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04281 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(Append((CHOOSE f \in [2..1 -> {1, 2}] : TRUE), (1 \div 0))), (IF ({1, 2} = {x \in 1..3 : x > 1}) THEN LET b6740 == 3 IN b6740 ELSE Cardinality({1}) - ((2147483647 - 2147483647) * (2 * -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 210 to line 14, col 210 of module random_04281 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 208.
    | Expression starting at line 14, column 208.
    | ExtendableExpr starting at line 14, column 207.
    | ExtendableExpr starting at line 14, column 179.
    | Expression starting at line 14, column 179.
    | Fatal errors while parsing TLA+ spec in file random_04281
    | In module random_04281
    | Could not parse module random_04281 from file random_04281.tla
    | *** Errors: 1
    | In module random_04281
    | Could not parse module random_04281 from file random_04281.tla
    3002:1 Parsing or semantic analysis failed.
---*)
