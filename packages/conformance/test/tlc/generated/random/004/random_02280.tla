(*---
description: Evaluates a random seq expression, seed 262, number 2280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = SubSeq(<<1>>, 7, 2147483647)] EXCEPT ![1] = Cardinality((0 - 2147483647))] \o SubSeq(Append(<<2147483647, 0>>, Head(<<1, 2>>)), ((-3) \div (7 \div -1)), ([a |-> -1, b |-> FALSE]).a)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 216 to line 14, col 219 of module random_02280 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 214.
    | Expression starting at line 14, column 214.
    | ExtendableExpr starting at line 14, column 213.
    | ExtendableExpr starting at line 14, column 203.
    | Expression starting at line 14, column 203.
    | Fatal errors while parsing TLA+ spec in file random_02280
    | In module random_02280
    | Could not parse module random_02280 from file random_02280.tla
    | *** Errors: 1
    | In module random_02280
    | Could not parse module random_02280 from file random_02280.tla
    3002:1 Parsing or semantic analysis failed.
---*)
