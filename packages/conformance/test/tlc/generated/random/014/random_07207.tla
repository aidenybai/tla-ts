(*---
description: Evaluates a random seq expression, seed 262, number 7207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) EXCEPT ![1] = CASE (\E b11074 \in 1..3 : FALSE) -> (2147483647 + 0) [] OTHER -> [<<1, 2>> EXCEPT ![1] = -1]] \o SortSeq([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = @ + (3 \div -1)], LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 263 to line 14, col 266 of module random_07207 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 261.
    | Expression starting at line 14, column 261.
    | ExtendableExpr starting at line 14, column 260.
    | ExtendableExpr starting at line 14, column 256.
    | Expression starting at line 14, column 256.
    | Fatal errors while parsing TLA+ spec in file random_07207
    | In module random_07207
    | Could not parse module random_07207 from file random_07207.tla
    | *** Errors: 1
    | In module random_07207
    | Could not parse module random_07207 from file random_07207.tla
    3002:1 Parsing or semantic analysis failed.
---*)
