(*---
description: Evaluates a random function expression, seed 262, number 1193.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01193 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([b1913 \in {x \in 1..3 : x > 1} |-> b1913])[(1 - 7)] .. (\A b1914 \in DOMAIN [x \in 1..2 |-> x] : (<<1>> = <<5, 6>>))) EXCEPT ![(((1 * 0) + (-1 * 0)) + LET b1915 == (7 \div -1) IN (CHOOSE b1916 \in 1..3 : TRUE))] = ((CASE FALSE -> 1 [] OTHER -> 2147483647 % (--1)) % LET b1917 == IF TRUE THEN 1 ELSE 1 IN (CHOOSE b1918 \in {2, 1, 3} : FALSE))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 187 to line 14, col 190 of module random_01193 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 185.
    | Expression starting at line 14, column 185.
    | ExtendableExpr starting at line 14, column 184.
    | Expression starting at line 14, column 184.
    | Definition starting at line 14, column 175.
    | Fatal errors while parsing TLA+ spec in file random_01193
    | In module random_01193
    | Could not parse module random_01193 from file random_01193.tla
    | *** Errors: 1
    | In module random_01193
    | Could not parse module random_01193 from file random_01193.tla
    3002:1 Parsing or semantic analysis failed.
---*)
