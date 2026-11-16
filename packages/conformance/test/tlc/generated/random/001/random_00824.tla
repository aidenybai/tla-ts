(*---
description: Evaluates a random function expression, seed 262, number 824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq((Tail(<<>>) \o Tail(<<3, 1, 2>>)), (-(-1 \div -1)), CASE (2147483647 \in {1, 2}) -> Len(FALSE) [] OTHER -> (0 * 3)) :> Len((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \o (2147483647 < 2147483647)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 65 to line 14, col 68 of module random_00824 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 63.
    | Expression starting at line 14, column 62.
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 60.
    | ExtendableExpr starting at line 14, column 59.
    | Fatal errors while parsing TLA+ spec in file random_00824
    | In module random_00824
    | Could not parse module random_00824 from file random_00824.tla
    | *** Errors: 1
    | In module random_00824
    | Could not parse module random_00824 from file random_00824.tla
    3002:1 Parsing or semantic analysis failed.
---*)
