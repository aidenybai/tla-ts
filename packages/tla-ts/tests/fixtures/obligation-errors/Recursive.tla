---- MODULE Recursive ----
Op == LET RECURSIVE F(_)
          F(n) == n
      IN F(1)
====
