(*---
description: Evaluates a random int expression, seed 262, number 2852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((CHOOSE r \in [a : {1}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]) -> Cardinality({b4520 \in SUBSET {1} : TRUE}) [] OTHER -> (LET b4521 == 2147483647 IN <<>> + ([a |-> 1, b |-> TRUE]).a) \div LET b4522 == LET b4523 == (0 \div 3) IN (b4523 % 2147483647) IN IF ({2, 1, 3} = {x \in 1..3 : x > 1}) THEN Head(<<1, 2>>) ELSE (b4522 * -1)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 356 to line 14, col 356 of module random_02852 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 350.
    | Expression starting at line 14, column 350.
    | ExtendableExpr starting at line 14, column 349.
    | Expression starting at line 14, column 349.
    | IF THEN ELSE starting at line 14, column 286.
    | Fatal errors while parsing TLA+ spec in file random_02852
    | In module random_02852
    | Could not parse module random_02852 from file random_02852.tla
    | *** Errors: 1
    | In module random_02852
    | Could not parse module random_02852 from file random_02852.tla
    3002:1 Parsing or semantic analysis failed.
---*)
