---- MODULE UserFileLong ----
EXTENDS Naturals, TLC
VARIABLE x
ASSUME PrintT([i \in 1..12 |-> i * 100000])
ASSUME Print([i \in 1..12 |-> i * 100000], TRUE)
Init == x = 0
Next == x' = (x + 1) % 3
ReachesTheFirstLongState == x = 1
ReachesTheSecondLongState == x = 2
ReachesTheThirdLongStateNever == x = 5
AlsoNeverReachedWithLongName == x = 7
====
