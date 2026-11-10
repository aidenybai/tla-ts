(*---
description: Evaluates a random function expression, seed 262, number 7438.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07438 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11468 \in ({Cardinality(b11469) : b11469 \in UNION {{}, {x \in 1..3 : x > 1}}} \cup ((-1 \div -1) .. (2 % 3))) |-> (-Len(SubSeq(<<1>>, b11468, 3)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 107 to line 14, col 110 of module random_07438 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 105.
    | Expression starting at line 14, column 104.
    | ExtendableExpr starting at line 14, column 103.
    | Expression starting at line 14, column 103.
    | ExtendableExpr starting at line 14, column 102.
    | Fatal errors while parsing TLA+ spec in file random_07438
    | In module random_07438
    | Could not parse module random_07438 from file random_07438.tla
    | *** Errors: 1
    | In module random_07438
    | Could not parse module random_07438 from file random_07438.tla
    3002:1 Parsing or semantic analysis failed.
---*)
