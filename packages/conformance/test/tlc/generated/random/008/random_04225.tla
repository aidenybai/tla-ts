(*---
description: Evaluates a random seq expression, seed 262, number 4225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 2], LAMBDA e : e > 0), LAMBDA e : e > 0), LET b6641 == LET b6642 == ([a |-> 1] \div -1) IN Len(<<3, 1, 2>>) IN Cardinality({[a |-> 1] : b6643 \in {}})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 149 to line 14, col 152 of module random_04225 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 139.
    | Expression starting at line 14, column 139.
    | ExtendableExpr starting at line 14, column 138.
    | Expression starting at line 14, column 138.
    | Definition starting at line 14, column 129.
    | Fatal errors while parsing TLA+ spec in file random_04225
    | In module random_04225
    | Could not parse module random_04225 from file random_04225.tla
    | *** Errors: 1
    | In module random_04225
    | Could not parse module random_04225 from file random_04225.tla
    3002:1 Parsing or semantic analysis failed.
---*)
