(*---
description: Evaluates a random seq expression, seed 262, number 4772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([Tail((2 :> 1)) EXCEPT ![1] = ((7 \div 0) \div (1 % 7))], CASE (~SubSeq(<<3, 1, 2>>, 2, 7)) -> ((SUBSET {1} % 2147483647) \div (7 % 2147483647)) [] OTHER -> Head([<<3, 1, 2>> EXCEPT ![1] = 2])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 120 to line 14, col 125 of module random_04772 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 120.
    | ExtendableExpr starting at line 14, column 119.
    | Expression starting at line 14, column 119.
    | ExtendableExpr starting at line 14, column 118.
    | Fatal errors while parsing TLA+ spec in file random_04772
    | In module random_04772
    | Could not parse module random_04772 from file random_04772.tla
    | *** Errors: 1
    | In module random_04772
    | Could not parse module random_04772 from file random_04772.tla
    3002:1 Parsing or semantic analysis failed.
---*)
