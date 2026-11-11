(*---
description: Evaluates a random set expression, seed 262, number 880.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00880 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ([a |-> 1] = [a |-> 1]) -> SortSeq(<<>>, LAMBDA p, q : p < q) [] OTHER -> (7 \div -1) - ((7 - -1) * (<<5, 6>>)[7])) .. ([b1422 \in {b1423 \in 2..1 : TRUE} |-> Append(<<1>>, b1422)])[Len((<<>> \o <<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 100 to line 14, col 103 of module random_00880 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | Case Other Arm starting at line 14, column 88.
    | Fatal errors while parsing TLA+ spec in file random_00880
    | In module random_00880
    | Could not parse module random_00880 from file random_00880.tla
    | *** Errors: 1
    | In module random_00880
    | Could not parse module random_00880 from file random_00880.tla
    3002:1 Parsing or semantic analysis failed.
---*)
