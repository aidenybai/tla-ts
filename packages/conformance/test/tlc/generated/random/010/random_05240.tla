(*---
description: Evaluates a random seq expression, seed 262, number 5240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SortSeq(SubSeq(<<>>, -1, 1), LAMBDA p, q : p < q) EXCEPT ![1] = Head(Tail(<<1, 2>>))] \o [[SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = Len(<<>>)] EXCEPT ![1] = {(2147483647 - 2), (2147483647 \div -1)}]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 214 to line 14, col 217 of module random_05240 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 203.
    | Expression starting at line 14, column 203.
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | Some { } form starting at line 14, column 183.
    | Fatal errors while parsing TLA+ spec in file random_05240
    | In module random_05240
    | Could not parse module random_05240 from file random_05240.tla
    | *** Errors: 1
    | In module random_05240
    | Could not parse module random_05240 from file random_05240.tla
    3002:1 Parsing or semantic analysis failed.
---*)
