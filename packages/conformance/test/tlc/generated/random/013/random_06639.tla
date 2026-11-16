(*---
description: Evaluates a random set expression, seed 262, number 6639.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06639 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head([Tail(<<>>) EXCEPT ![1] = (TRUE % 2147483647)]) .. CASE ((-1 * -1) = Cardinality(<<5, 6>>)) -> (Len(<<1>>) + (2147483647 % 2147483647)) [] OTHER -> CASE UNION {{x \in 1..3 : x > 1}, SUBSET {1}} -> (-0) [] OTHER -> (1 \div 2)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 83 to line 14, col 83 of module random_06639 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 81.
    | Expression starting at line 14, column 80.
    | ExtendableExpr starting at line 14, column 79.
    | Expression starting at line 14, column 79.
    | ExtendableExpr starting at line 14, column 78.
    | Fatal errors while parsing TLA+ spec in file random_06639
    | In module random_06639
    | Could not parse module random_06639 from file random_06639.tla
    | *** Errors: 1
    | In module random_06639
    | Could not parse module random_06639 from file random_06639.tla
    3002:1 Parsing or semantic analysis failed.
---*)
