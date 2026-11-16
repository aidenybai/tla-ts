(*---
description: Evaluates a random set expression, seed 262, number 8323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (Nat \subseteq {1}) THEN (-1 \div -1) ELSE Len(<<1, 2>>) = ([a |-> 1, b |-> FALSE]).a) .. Head(SubSeq(Tail(<<1>>), (1 * -1), (2 % 2)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 50 to line 14, col 53 of module random_08323 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 48.
    | Expression starting at line 14, column 47.
    | ExtendableExpr starting at line 14, column 46.
    | Expression starting at line 14, column 46.
    | IF THEN ELSE starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_08323
    | In module random_08323
    | Could not parse module random_08323 from file random_08323.tla
    | *** Errors: 1
    | In module random_08323
    | Could not parse module random_08323 from file random_08323.tla
    3002:1 Parsing or semantic analysis failed.
---*)
