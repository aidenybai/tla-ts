(*---
description: Evaluates a random seq expression, seed 262, number 9018.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SubSeq(Append(<<1>>, 0), (2 \div -1), ([a |-> 1]).a)), ((CHOOSE r \in [a : 1..2] : TRUE)).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 56 to line 14, col 59 of module random_09018 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 54.
    | Expression starting at line 14, column 54.
    | ExtendableExpr starting at line 14, column 53.
    | Expression starting at line 14, column 53.
    | Optional Arguments starting at line 14, column 34.
    | Fatal errors while parsing TLA+ spec in file random_09018
    | In module random_09018
    | Could not parse module random_09018 from file random_09018.tla
    | *** Errors: 1
    | In module random_09018
    | Could not parse module random_09018 from file random_09018.tla
    3002:1 Parsing or semantic analysis failed.
---*)
