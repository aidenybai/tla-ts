(*---
description: Evaluates a random set expression, seed 262, number 4516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b7098 \in (<<3, 1, 2>> \cup {x \in 1..3 : x > 1}) : (FALSE => FALSE)} \cup ((-1 \div 7) .. (1 - 1))) \cap DOMAIN [(1 :> -1) EXCEPT ![(0 - 2)] = (7 * -1)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 166 to line 14, col 166 of module random_04516 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 164.
    | Expression starting at line 14, column 164.
    | ExtendableExpr starting at line 14, column 163.
    | Expression starting at line 14, column 163.
    | Except Spec starting at line 14, column 150.
    | Fatal errors while parsing TLA+ spec in file random_04516
    | In module random_04516
    | Could not parse module random_04516 from file random_04516.tla
    | *** Errors: 1
    | In module random_04516
    | Could not parse module random_04516 from file random_04516.tla
    3002:1 Parsing or semantic analysis failed.
---*)
