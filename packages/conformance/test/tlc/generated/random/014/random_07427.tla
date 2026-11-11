(*---
description: Evaluates a random seq expression, seed 262, number 7427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), ((1 :> 2))[2147483647], (0 \div -1)), CASE (\E b11445 \in {1, 2} : [x \in 1..2 |-> x]) -> Head(<<1, 2>>) [] OTHER -> (3 * 3), LET b11446 == (7 \div 0) IN [a |-> 1, b |-> TRUE]) \o Append(Append((--1), Len(<<>>)), Cardinality((1 .. 2147483647)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 100 to line 14, col 103 of module random_07427 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | Optional Arguments starting at line 14, column 30.
    | Fatal errors while parsing TLA+ spec in file random_07427
    | In module random_07427
    | Could not parse module random_07427 from file random_07427.tla
    | *** Errors: 1
    | In module random_07427
    | Could not parse module random_07427 from file random_07427.tla
    3002:1 Parsing or semantic analysis failed.
---*)
