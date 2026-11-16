(*---
description: Evaluates a random seq expression, seed 262, number 4993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SelectSeq([<<>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0), LAMBDA p, q : p < q), CASE ({1, 7} \subseteq {-1, 7}) -> ((2 \div <<5, 6>>) \div (-1 \div -1)) [] OTHER -> Head((<<>> \o <<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 178 to line 14, col 181 of module random_04993 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 176.
    | Expression starting at line 14, column 175.
    | ExtendableExpr starting at line 14, column 174.
    | ExtendableExpr starting at line 14, column 151.
    | Expression starting at line 14, column 151.
    | Fatal errors while parsing TLA+ spec in file random_04993
    | In module random_04993
    | Could not parse module random_04993 from file random_04993.tla
    | *** Errors: 1
    | In module random_04993
    | Could not parse module random_04993 from file random_04993.tla
    3002:1 Parsing or semantic analysis failed.
---*)
