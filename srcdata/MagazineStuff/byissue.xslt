<?xml version="1.0"?>

<!-- $Id: byissue.xslt,v 1.1 2004/08/11 01:29:48 DaveT Exp DaveT $ -->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:output method="html"/>
    <xsl:preserve-space elements="text"/>

    <xsl:template match="/">
        <html>
            <head>
                <link href="stylesheet.css" type="text/css" rel="stylesheet"/>
            </head>
            <body>
                <p>
                    <xsl:for-each select="/sources/journal">
                        <p class="journalTitle"><xsl:value-of select="@name"/></p>
                    </xsl:for-each>
                </p>
                <p/>
                <hr/>
                <table>
                <xsl:apply-templates select="/sources/journal"/>
                </table>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="/sources/journal">
        <xsl:apply-templates select="issue"/>
    </xsl:template>

    <xsl:template match="issue">
        <tr><td><br/></td></tr>
        <tr class="volumeName"><td colspan="2">Volume <xsl:value-of select="@volume"/> #<xsl:value-of select="@number"/></td></tr>
        <xsl:apply-templates select="article"/>
    </xsl:template>

    <xsl:template match="article">
        <tr>
        <td class="articleTitle">
            <xsl:value-of select="@title"/>
            <xsl:if test="@subtitle">
                <xsl:text>: </xsl:text><xsl:value-of select="@subtitle"/>
            </xsl:if>
        </td>
        <td class="authorName">
            <xsl:for-each select="author">
                <xsl:choose>
                    <xsl:when test="position()=1"></xsl:when>
                    <xsl:otherwise><xsl:text>, </xsl:text></xsl:otherwise>
                </xsl:choose>
                <xsl:value-of select="@firstName"/>
                <xsl:text> </xsl:text>
                <xsl:value-of select="@middleName"/>
                <xsl:text> </xsl:text>
                <xsl:value-of select="@lastName"/>
                <xsl:text> </xsl:text>
                <xsl:value-of select="@suffix"/>
            </xsl:for-each>
        </td>
        </tr>
    </xsl:template>
</xsl:stylesheet>
