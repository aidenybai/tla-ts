(*---
description: Evaluates a random int expression, seed 262, number 3212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (IF (TRUE \/ TRUE) THEN (-1 \div -1) ELSE Head(<<1, 2>>) \in {Len(<<1>>), Len(<<>>)}) -> (((CHOOSE r \in [a : {}] : TRUE)).a :> (IF TRUE THEN -1 ELSE 2 - LET b5101 == 2147483647 IN 3)) [] OTHER -> ([b5102 \in {7, -1} |-> Len(<<3, 1, 2>>)])[((0 - 2) * ([a |-> 1])[2147483647])])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 49 to line 14, col 52 of module random_03212 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 47.
    | Expression starting at line 14, column 46.
    | ExtendableExpr starting at line 14, column 45.
    | Expression starting at line 14, column 45.
    | IF THEN ELSE starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_03212
    | In module random_03212
    | Could not parse module random_03212 from file random_03212.tla
    | *** Errors: 1
    | In module random_03212
    | Could not parse module random_03212 from file random_03212.tla
    3002:1 Parsing or semantic analysis failed.
---*)
