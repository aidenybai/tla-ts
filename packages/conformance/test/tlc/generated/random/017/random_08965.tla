(*---
description: Evaluates a random set expression, seed 262, number 8965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), (-b13904), (3 - b13904))) : b13904 \in {([a |-> 1, b |-> FALSE]).a, (IF FALSE THEN 2147483647 ELSE 2 * (3 \div -1))}})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 170 to line 14, col 173 of module random_08965 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 168.
    | Expression starting at line 14, column 168.
    | ExtendableExpr starting at line 14, column 167.
    | ExtendableExpr starting at line 14, column 163.
    | Expression starting at line 14, column 163.
    | Fatal errors while parsing TLA+ spec in file random_08965
    | In module random_08965
    | Could not parse module random_08965 from file random_08965.tla
    | *** Errors: 1
    | In module random_08965
    | Could not parse module random_08965 from file random_08965.tla
    3002:1 Parsing or semantic analysis failed.
---*)
