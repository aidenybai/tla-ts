(*---
description: Evaluates a random set expression, seed 262, number 7819.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07819 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([((<<3, 1, 2>> \o <<1, 2>>) \o Tail(<<1>>)) EXCEPT ![1] = ((2147483647 + 1) % (-1 \div -1))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 106 to line 14, col 109 of module random_07819 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 104.
    | Expression starting at line 14, column 103.
    | ExtendableExpr starting at line 14, column 102.
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 83.
    | Fatal errors while parsing TLA+ spec in file random_07819
    | In module random_07819
    | Could not parse module random_07819 from file random_07819.tla
    | *** Errors: 1
    | In module random_07819
    | Could not parse module random_07819 from file random_07819.tla
    3002:1 Parsing or semantic analysis failed.
---*)
