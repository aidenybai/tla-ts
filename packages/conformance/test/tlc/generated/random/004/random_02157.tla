(*---
description: Evaluates a random bool expression, seed 262, number 2157.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02157 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(<<[[x \in 1..2 |-> x] EXCEPT ![3] = 0], Head(TRUE)>>, LAMBDA e : e > 0) = [(IF TRUE THEN 1 ELSE 1 :> (-1 \div -1)) EXCEPT ![(Len(<<>>) + Len(<<3, 1, 2>>))] = LET b3409 == [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] IN (-2)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 132 to line 14, col 135 of module random_02157 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 130.
    | Expression starting at line 14, column 129.
    | ExtendableExpr starting at line 14, column 128.
    | ExtendableExpr starting at line 14, column 123.
    | Expression starting at line 14, column 123.
    | Fatal errors while parsing TLA+ spec in file random_02157
    | In module random_02157
    | Could not parse module random_02157 from file random_02157.tla
    | *** Errors: 1
    | In module random_02157
    | Could not parse module random_02157 from file random_02157.tla
    3002:1 Parsing or semantic analysis failed.
---*)
