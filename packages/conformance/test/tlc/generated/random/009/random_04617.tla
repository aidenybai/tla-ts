(*---
description: Evaluates a random set expression, seed 262, number 4617.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04617 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF ({} \subseteq 1..3) THEN (2 + 2147483647) ELSE ([a |-> 1, b |-> TRUE]).a * (DOMAIN <<5, 6>> \cap (SUBSET {1} \cap {1}))) .. LET b7228 == ((-3) * (2 \div -1)) IN (CASE TRUE -> b7228 [] OTHER -> 3 + (<<>> % b7228))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 169 to line 14, col 172 of module random_04617 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 167.
    | Expression starting at line 14, column 167.
    | ExtendableExpr starting at line 14, column 166.
    | ExtendableExpr starting at line 14, column 159.
    | Expression starting at line 14, column 159.
    | Fatal errors while parsing TLA+ spec in file random_04617
    | In module random_04617
    | Could not parse module random_04617 from file random_04617.tla
    | *** Errors: 1
    | In module random_04617
    | Could not parse module random_04617 from file random_04617.tla
    3002:1 Parsing or semantic analysis failed.
---*)
