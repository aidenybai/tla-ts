------------------------------ MODULE Channel ------------------------------
CONSTANT Data

VARIABLE channel

TypeOK == channel \in Data

Send(item) == channel' = item

Idle == UNCHANGED channel
=============================================================================
