(*---
description: Evaluates a random int expression, seed 262, number 9142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = (-2147483647)], ([a |-> 0, b |-> FALSE]).a, CASE (FALSE \/ FALSE) -> ({2, 1, 3} \div -1) [] OTHER -> LET b14199 == 0 IN 0)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 157 to line 14, col 160 of module random_09142 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 147.
    | Expression starting at line 14, column 147.
    | ExtendableExpr starting at line 14, column 146.
    | Expression starting at line 14, column 146.
    | Case Arm starting at line 14, column 126.
    | Fatal errors while parsing TLA+ spec in file random_09142
    | In module random_09142
    | Could not parse module random_09142 from file random_09142.tla
    | *** Errors: 1
    | In module random_09142
    | Could not parse module random_09142 from file random_09142.tla
    3002:1 Parsing or semantic analysis failed.
---*)
