(*---
description: Evaluates a random bool expression, seed 262, number 7947.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07947 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(Len(<<>>) + Head((1 :> 2))), IF ({1} \subseteq {}) THEN CASE FALSE -> 3 [] OTHER -> 3 ELSE (0 \div -1)>> = [((1 \div 7) :> IF FALSE THEN 7 ELSE 0) EXCEPT ![Len(<<-1, 3>>)] = (-Head(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 114 to line 14, col 117 of module random_07947 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 112.
    | Expression starting at line 14, column 112.
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 111.
    | IF THEN ELSE starting at line 14, column 49.
    | Fatal errors while parsing TLA+ spec in file random_07947
    | In module random_07947
    | Could not parse module random_07947 from file random_07947.tla
    | *** Errors: 1
    | In module random_07947
    | Could not parse module random_07947 from file random_07947.tla
    3002:1 Parsing or semantic analysis failed.
---*)
