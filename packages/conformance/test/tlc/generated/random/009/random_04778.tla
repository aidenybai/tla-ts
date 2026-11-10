(*---
description: Evaluates a random set expression, seed 262, number 4778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] EXCEPT !.a = (2 \div 1)]).a .. (CASE ({x \in 1..3 : x > 1} = {}) -> (CHOOSE b7459 \in 1..3 : FALSE) [] OTHER -> (-1 * -1) % ((CHOOSE b7460 \in 1..3 : FALSE) + Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 178 to line 14, col 178 of module random_04778 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 176.
    | Expression starting at line 14, column 175.
    | ExtendableExpr starting at line 14, column 174.
    | Expression starting at line 14, column 174.
    | Case Other Arm starting at line 14, column 165.
    | Fatal errors while parsing TLA+ spec in file random_04778
    | In module random_04778
    | Could not parse module random_04778 from file random_04778.tla
    | *** Errors: 1
    | In module random_04778
    | Could not parse module random_04778 from file random_04778.tla
    3002:1 Parsing or semantic analysis failed.
---*)
