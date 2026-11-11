(*---
description: Evaluates a random function expression, seed 262, number 2173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(Len(<<>>) :> ({1}).a) EXCEPT ![(IF TRUE THEN 7 ELSE 2147483647 % (7 \div 2))] = ((2 :> 2147483647))[(-1 % 7)]] EXCEPT ![LET b3427 == (CHOOSE b3428 \in {TRUE, 7} : (FALSE => FALSE)) IN ((b3427 - <<>>) \div Head(<<>>))] = LET b3429 == (-(0 \div -1)) IN ((3 - b3429) + (b3429 - 2147483647))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 257 to line 14, col 260 of module random_02173 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 255.
    | Expression starting at line 14, column 255.
    | ExtendableExpr starting at line 14, column 254.
    | Expression starting at line 14, column 253.
    | ExtendableExpr starting at line 14, column 252.
    | Fatal errors while parsing TLA+ spec in file random_02173
    | In module random_02173
    | Could not parse module random_02173 from file random_02173.tla
    | *** Errors: 1
    | In module random_02173
    | Could not parse module random_02173 from file random_02173.tla
    3002:1 Parsing or semantic analysis failed.
---*)
